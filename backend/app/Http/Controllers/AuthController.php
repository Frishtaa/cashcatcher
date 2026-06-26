<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    private function defaultCategories(string $language = 'en'): array
    {
        $names = [
            'en' => ['Salary','Freelance','Investment','Other Income','Food & Dining','Transportation','Housing','Entertainment','Health','Shopping','Education','Other'],
            'ar' => ['الراتب','عمل حر','استثمار','دخل آخر','طعام ومطاعم','مواصلات','سكن','ترفيه','صحة','تسوق','تعليم','أخرى'],
            'ku' => ['مووچە','کارکردنی سەربەخۆ','وەبەرهێنان','داهاتی تر','خواردن و چێشتخانە','گواستنەوە','خانوو','کێف و سەرگەرمی','تەندروستی','بازاڕکردن','پەروەردە','تر'],
        ];
        $n = $names[$language] ?? $names['en'];
        return [
            ['name'=>$n[0],  'type'=>'income',  'color'=>'#22c55e','icon'=>'💼'],
            ['name'=>$n[1],  'type'=>'income',  'color'=>'#3b82f6','icon'=>'💻'],
            ['name'=>$n[2],  'type'=>'income',  'color'=>'#a855f7','icon'=>'📈'],
            ['name'=>$n[3],  'type'=>'income',  'color'=>'#06b6d4','icon'=>'💰'],
            ['name'=>$n[4],  'type'=>'expense', 'color'=>'#f97316','icon'=>'🍽️'],
            ['name'=>$n[5],  'type'=>'expense', 'color'=>'#eab308','icon'=>'🚗'],
            ['name'=>$n[6],  'type'=>'expense', 'color'=>'#ef4444','icon'=>'🏠'],
            ['name'=>$n[7],  'type'=>'expense', 'color'=>'#ec4899','icon'=>'🎬'],
            ['name'=>$n[8],  'type'=>'expense', 'color'=>'#14b8a6','icon'=>'🏥'],
            ['name'=>$n[9],  'type'=>'expense', 'color'=>'#8b5cf6','icon'=>'🛍️'],
            ['name'=>$n[10], 'type'=>'expense', 'color'=>'#f59e0b','icon'=>'📚'],
            ['name'=>$n[11], 'type'=>'expense', 'color'=>'#6b7280','icon'=>'📦'],
        ];
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],

        ]);

        $user = User::create([
            'name'      => $data['name'],
            'email'     => strtolower($data['email']),
            'password'  => Hash::make($data['password']),
        ]);

        foreach ($this->defaultCategories('en') as $cat) {
            Category::create(array_merge($cat, ['user_id' => $user->id]));
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($request->email))->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'A password reset link has been sent to your email.']);
        }

        if ($status === Password::INVALID_USER) {
            return response()->json(['message' => 'If that email exists, a password reset link has been sent.']);
        }

        return response()->json(['message' => __($status)], 422);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|string|email',
            'password' => ['required', 'string', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Your password has been reset successfully.']);
        }

        return response()->json(['message' => __($status)], 422);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
        ];
    }
}
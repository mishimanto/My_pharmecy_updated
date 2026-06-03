<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        return $this->ok(
            $request->user()->notifications()->latest()->paginate($request->integer('per_page', 15)),
            'নোটিফিকেশন তালিকা পাওয়া গেছে।'
        );
    }

    public function read(Request $request, int $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->update([
            'status' => 'read',
            'read_at' => now(),
        ]);

        return $this->ok($notification->fresh(), 'নোটিফিকেশন পড়া হয়েছে।');
    }
}

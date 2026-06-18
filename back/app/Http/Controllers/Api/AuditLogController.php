<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        return AuditLog::with('utilisateur')
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->string('action')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('du'), fn ($q) => $q->whereDate('created_at', '>=', $request->string('du')))
            ->when($request->filled('au'), fn ($q) => $q->whereDate('created_at', '<=', $request->string('au')))
            ->latest()
            ->limit(200)
            ->get();
    }
}

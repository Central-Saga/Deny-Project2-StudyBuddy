<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    
    'allowed_methods' => ['*'],

    // HAPUS wildcard '*', ganti dengan domain frontend yang spesifik
    'allowed_origins' => ['http://localhost:3000'],

    'allowed_origins_patterns' => [],
    
    'allowed_headers' => ['*'],
    
    'exposed_headers' => [],
    
    'max_age' => 0,

    // UBAH menjadi true karena Next.js (Axios/Fetch) mengirimkan credentials/token
    'supports_credentials' => true,
];
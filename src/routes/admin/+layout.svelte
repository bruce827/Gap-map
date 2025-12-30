<div class="min-h-dvh bg-gray-50">
  <div class="border-b bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
      <a href="/admin" class="text-lg font-semibold">Admin</a>
      <nav class="flex gap-4 text-sm">
        <a href="/admin" class="text-gray-700 hover:underline">Home</a>
        <a href="/admin/cities" class="text-gray-700 hover:underline">Cities</a>
      </nav>
    </div>
  </div>

  <div class="mx-auto max-w-5xl px-6 py-8">
    <slot />
  </div>
</div>

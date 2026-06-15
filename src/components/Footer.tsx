export default function Footer() {
  return (
    <footer className="mt-20 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-zinc-500">
        
        <p>© 2026 emptymag</p>

        <a
          href="https://t.me/ridina_ua"
          target="_blank"
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-700 transition hover:bg-zinc-100"
        >
          Telegram
        </a>

      </div>
    </footer>
  );
}
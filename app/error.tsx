"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Algo deu errado
        </h2>
        <p className="text-[#5C5C5C] mb-6 text-sm">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#C4A882] text-white rounded-lg hover:bg-[#B39972] transition-colors text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const messages = {
  ar: { title: 'حدث خطأ ما', desc: 'حدث خطأ غير متوقع. يرجى تحديث الصفحة للمحاولة مرة أخرى.', btn: 'تحديث الصفحة' },
  fr: { title: 'Une erreur est survenue', desc: 'Une erreur inattendue s\'est produite. Veuillez actualiser la page.', btn: 'Actualiser' },
  en: { title: 'Something went wrong', desc: 'An unexpected error occurred. Please refresh the page to try again.', btn: 'Refresh Page' },
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
      const locale = lang.startsWith('ar') ? 'ar' : lang.startsWith('fr') ? 'fr' : 'en';
      const msg = messages[locale];
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-8">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">{msg.title}</h2>
            <p className="text-muted-foreground mb-6">{msg.desc}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-all"
            >
              {msg.btn}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
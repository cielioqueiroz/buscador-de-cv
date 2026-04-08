import { Header } from './Header';

export const Layout = ({ children, showBreadcrumb = false, breadcrumb = null }) => {
  return (
    <div className="
      min-h-screen transition-colors
      bg-white dark:bg-[#151929]
    ">
      <Header showBreadcrumb={showBreadcrumb} breadcrumb={breadcrumb} />
      <main className="
        max-w-6xl mx-auto px-6 py-12
        pt-16
      ">
        {children}
      </main>
    </div>
  );
};

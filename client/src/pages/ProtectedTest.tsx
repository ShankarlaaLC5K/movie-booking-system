function ProtectedTest() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white">
          Protected Page
        </h1>

        <p className="mt-4 text-slate-400">
          You are logged in and can access protected
          pages.
        </p>
      </div>
    </section>
  );
}

export default ProtectedTest;

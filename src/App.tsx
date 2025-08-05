function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Chain Workspace Application
            </h1>
            <div className="flex items-center space-x-4">
              <button className="btn btn-primary">New Chain</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Chain Workspace
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create and manage document processing chains with AI agents
          </p>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500">
              Project structure initialized successfully! 🎉
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Next steps: Set up database, implement schemas, and build the
              canvas interface.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

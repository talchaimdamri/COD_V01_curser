import { CanvasDemo } from './components/canvas'
import { InspectorDemo } from './components/inspector'

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
        <InspectorDemo />
      </main>
    </div>
  )
}

export default App

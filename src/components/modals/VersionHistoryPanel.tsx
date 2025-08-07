import React, { useState, useEffect, useCallback } from 'react'
import { Version } from '../../../api/services/versionHistory'

interface VersionHistoryPanelProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
  onVersionRestore: (versionId: string) => void
  currentContent: string
}

interface VersionDiff {
  added: string[]
  removed: string[]
  unchanged: string[]
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  documentId,
  isOpen,
  onClose,
  onVersionRestore,
  currentContent,
}) => {
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersion, setCompareVersion] = useState<Version | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch versions when panel opens
  useEffect(() => {
    if (isOpen && documentId) {
      fetchVersions()
    }
  }, [isOpen, documentId])

  // Fetch version history from API
  const fetchVersions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/versions?documentId=${documentId}&limit=50`)
      const data = await response.json()
      
      if (data.success) {
        setVersions(data.versions)
      } else {
        setError('Failed to load version history')
      }
    } catch (err) {
      setError('Failed to load version history')
      console.error('Error fetching versions:', err)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  // Fetch diff between two versions
  const fetchDiff = useCallback(async (versionId1: string, versionId2: string) => {
    try {
      const response = await fetch(`/api/versions/diff?versionId1=${versionId1}&versionId2=${versionId2}`)
      const data = await response.json()
      
      if (data.success) {
        setDiff(data.diff)
      } else {
        setError('Failed to load diff')
      }
    } catch (err) {
      setError('Failed to load diff')
      console.error('Error fetching diff:', err)
    }
  }, [])

  // Handle version selection
  const handleVersionSelect = useCallback((version: Version) => {
    setSelectedVersion(version)
    
    if (compareMode && compareVersion) {
      // Compare selected version with compare version
      fetchDiff(version.id, compareVersion.id)
    } else {
      // Compare with current content (simplified - in real implementation would compare with latest version)
      setDiff(null)
    }
  }, [compareMode, compareVersion, fetchDiff])

  // Handle version restoration
  const handleVersionRestore = useCallback(async (version: Version) => {
    try {
      const response = await fetch('/api/versions/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          versionId: version.id,
          description: `Restored to version ${version.versionNumber}`,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        onVersionRestore(version.id)
        onClose()
      } else {
        setError('Failed to restore version')
      }
    } catch (err) {
      setError('Failed to restore version')
      console.error('Error restoring version:', err)
    }
  }, [documentId, onVersionRestore, onClose])

  // Handle version deletion
  const handleVersionDelete = useCallback(async (version: Version) => {
    if (!confirm(`Are you sure you want to delete version ${version.versionNumber}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/versions/${version.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove from local state
        setVersions(prev => prev.filter(v => v.id !== version.id))
        
        if (selectedVersion?.id === version.id) {
          setSelectedVersion(null)
          setDiff(null)
        }
      } else {
        setError('Failed to delete version')
      }
    } catch (err) {
      setError('Failed to delete version')
      console.error('Error deleting version:', err)
    }
  }, [selectedVersion])

  // Toggle compare mode
  const toggleCompareMode = useCallback(() => {
    setCompareMode(!compareMode)
    if (compareMode) {
      setCompareVersion(null)
      setDiff(null)
    }
  }, [compareMode])

  // Handle compare version selection
  const handleCompareVersionSelect = useCallback((version: Version) => {
    setCompareVersion(version)
    
    if (selectedVersion) {
      fetchDiff(selectedVersion.id, version.id)
    }
  }, [selectedVersion, fetchDiff])

  if (!isOpen) {
    return null
  }

  return (
    <div
      data-testid="version-history-panel"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-[90%] h-[80%] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Version History - Document {documentId}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              data-testid="compare-versions-button"
              onClick={toggleCompareMode}
              className={`px-3 py-1 rounded text-sm ${
                compareMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </button>
            <button
              data-testid="close-version-history"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mx-4 mt-2 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Versions</h3>
              {loading && (
                <div className="text-sm text-gray-500">Loading versions...</div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div data-testid="version-list" className="space-y-1 p-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    data-testid="version-item"
                    className={`p-3 rounded cursor-pointer border ${
                      selectedVersion?.id === version.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleVersionSelect(version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Version {version.versionNumber}
                        </div>
                        <div data-testid="version-timestamp" className="text-xs text-gray-500">
                          {new Date(version.timestamp).toLocaleString()}
                        </div>
                        <div data-testid="version-description" className="text-xs text-gray-600 mt-1">
                          {version.description}
                        </div>
                        {version.isAutoSaved && (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1">
                            Auto-saved
                          </span>
                        )}
                      </div>
                      
                      {compareMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCompareVersionSelect(version)
                          }}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            compareVersion?.id === version.id
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Compare
                        </button>
                      )}
                    </div>
                    
                    {selectedVersion?.id === version.id && (
                      <div className="mt-2 flex space-x-2">
                        <button
                          data-testid="restore-version-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVersionRestore(version)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          Restore
                        </button>
                        <button
                          data-testid="view-diff-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            // In a real implementation, this would fetch diff with current version
                            console.log('View diff for version:', version.id)
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          View Diff
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVersionDelete(version)
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diff Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                {compareMode && compareVersion
                  ? `Comparing Version ${selectedVersion?.versionNumber} with Version ${compareVersion.versionNumber}`
                  : selectedVersion
                  ? `Version ${selectedVersion.versionNumber} Preview`
                  : 'Select a version to view details'}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedVersion && (
                <div>
                  {/* Version Details */}
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm">
                      <strong>Version:</strong> {selectedVersion.versionNumber}
                    </div>
                    <div className="text-sm">
                      <strong>Created:</strong> {new Date(selectedVersion.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <strong>Description:</strong> {selectedVersion.description}
                    </div>
                    {selectedVersion.parentVersionId && (
                      <div className="text-sm">
                        <strong>Parent:</strong> Version {selectedVersion.parentVersionId}
                      </div>
                    )}
                  </div>

                  {/* Diff View */}
                  {diff && (
                    <div data-testid="diff-view" className="space-y-2">
                      <h4 className="text-sm font-semibold">Changes:</h4>
                      
                      {diff.added.length > 0 && (
                        <div data-testid="diff-added" className="p-2 bg-green-50 border border-green-200 rounded">
                          <div className="text-xs font-semibold text-green-800 mb-1">Added:</div>
                          {diff.added.map((text, index) => (
                            <div key={index} className="text-sm text-green-700 font-mono">
                              + {text}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {diff.removed.length > 0 && (
                        <div data-testid="diff-removed" className="p-2 bg-red-50 border border-red-200 rounded">
                          <div className="text-xs font-semibold text-red-800 mb-1">Removed:</div>
                          {diff.removed.map((text, index) => (
                            <div key={index} className="text-sm text-red-700 font-mono">
                              - {text}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {diff.unchanged.length > 0 && (
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-xs font-semibold text-gray-800 mb-1">Unchanged:</div>
                          {diff.unchanged.map((text, index) => (
                            <div key={index} className="text-sm text-gray-700 font-mono">
                              {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Preview */}
                  {!diff && (
                    <div data-testid="diff-preview" className="space-y-2">
                      <h4 className="text-sm font-semibold">Content Preview:</h4>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded max-h-96 overflow-y-auto">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedVersion.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!selectedVersion && (
                <div className="text-center text-gray-500 py-8">
                  Select a version from the list to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersionHistoryPanel 
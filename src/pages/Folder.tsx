import { useCallback, useEffect, useState } from 'react'
import { BookOpenIcon, ChevronRightIcon } from '../components/shared/icons'

type FolderResponse = {
  folder_id: number
  user_id: number
  name: string
  created_at: string
}

type FolderPageProps = {
  token: string | null
  onOpenFolder: (folderId: number) => void
}

import { API_BASE_URL } from '../config'

function Folder({ token, onOpenFolder }: FolderPageProps) {
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)

  const [newFolderName, setNewFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null)

  const getAuthHeaders = useCallback(
    (includeJson = false): HeadersInit => ({
      ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const getErrorMessage = async (response: Response, fallback: string) => {
    try {
      const data: { detail?: string } = await response.json()
      return data.detail ?? fallback
    } catch {
      return fallback
    }
  }

  const loadFolders = useCallback(async () => {
    setIsLoadingFolders(true)
    setFolderError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to load cookbooks.'))
      }
      const data = (await response.json()) as FolderResponse[]
      setFolders(data)
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to load cookbooks.')
      setFolders([])
    } finally {
      setIsLoadingFolders(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    if (!token) {
      return
    }
    loadFolders()
  }, [token, loadFolders])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      setFolderError('Cookbook name is required.')
      return
    }

    setIsCreating(true)
    setFolderError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to create cookbook.'))
      }

      setNewFolderName('')
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create cookbook.')
    } finally {
      setIsCreating(false)
    }
  }

  const startRename = (folder: FolderResponse) => {
    setEditingFolderId(folder.folder_id)
    setEditingName(folder.name)
  }

  const handleRenameFolder = async (folderId: number) => {
    const name = editingName.trim()
    if (!name) {
      setFolderError('Cookbook name is required.')
      return
    }

    setIsUpdating(true)
    setFolderError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to update cookbook name.'))
      }

      setEditingFolderId(null)
      setEditingName('')
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to update cookbook.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteFolder = async (folderId: number) => {
    setDeletingFolderId(folderId)
    setFolderError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to delete cookbook.'))
      }
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to delete cookbook.')
    } finally {
      setDeletingFolderId(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 space-y-4 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-8 text-white shadow-xl shadow-orange-500/20 animate-fade-in">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
            My Cookbooks
          </p>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Your Recipe Collections
          </h1>
          <p className="max-w-2xl text-lg opacity-90">
            Organize your favorite recipes into cookbooks. Create collections for different
            cuisines, occasions, or dietary preferences.
          </p>
        </header>

        {/* Create Cookbook Section */}
        <section className="mb-8 rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Create New Cookbook</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Enter cookbook name..."
              className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-800 shadow-sm transition-all duration-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={isCreating}
              className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:from-orange-600 hover:to-red-600 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                'Create Cookbook'
              )}
            </button>
          </div>
        </section>

        {/* Error Display */}
        {folderError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-sm text-red-600 mt-1">{folderError}</p>
          </div>
        )}

        {/* Cookbooks Grid */}
        <section className="rounded-2xl border border-stone-200 bg-white/90 p-6 shadow-lg backdrop-blur-xl">
          <h2 className="mb-6 text-xl font-bold text-stone-900">Your Cookbooks</h2>

          {isLoadingFolders ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-orange-500" />
              <p className="mt-4 text-stone-600">Loading cookbooks...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 py-16">
              <h3 className="text-xl font-semibold text-stone-900">
                No Cookbooks Yet
              </h3>
              <p className="mt-2 text-stone-500">
                Create your first cookbook to start organizing recipes!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder) => {
                const isEditing = editingFolderId === folder.folder_id
                const isDeleting = deletingFolderId === folder.folder_id

                return (
                  <article
                    key={folder.folder_id}
                    className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10"
                  >
                    <div className="relative z-10 flex flex-col gap-4">
                      {/* Icon */}
                      <div className="flex items-start justify-between">
                        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-3 text-white shadow-lg shadow-orange-500/20">
                          <BookOpenIcon className="h-5 w-5" />
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenFolder(folder.folder_id)}
                            className="rounded-lg p-2 text-stone-400 hover:bg-white hover:text-orange-600 transition-colors"
                            title="Open cookbook"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="min-w-0">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 shadow-sm transition-all duration-200 hover:border-orange-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
                            autoFocus
                          />
                        ) : (
                          <h3 className="line-clamp-2 text-lg font-bold text-stone-900 group-hover:text-orange-700 transition-colors">
                            {folder.name}
                          </h3>
                        )}
                        <p className="mt-1 text-xs text-stone-500">
                          Created {new Date(folder.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-stone-200/50">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRenameFolder(folder.folder_id)}
                              disabled={isUpdating}
                              className="flex-1 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isUpdating ? '...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFolderId(null)
                                setEditingName('')
                              }}
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-50 active:scale-95"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startRename(folder)}
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-50 active:scale-95"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFolder(folder.folder_id)}
                              disabled={isDeleting}
                              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:border-red-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isDeleting ? '...' : 'Delete'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Folder

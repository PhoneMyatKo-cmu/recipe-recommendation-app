import { useCallback, useEffect, useState } from 'react'

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

const API_BASE_URL = 'http://127.0.0.1:8000'

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
        throw new Error(await getErrorMessage(response, 'Failed to load folders.'))
      }
      const data = (await response.json()) as FolderResponse[]
      setFolders(data)
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to load folders.')
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
      setFolderError('Folder name is required.')
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
        throw new Error(await getErrorMessage(response, 'Failed to create folder.'))
      }

      setNewFolderName('')
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder.')
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
      setFolderError('Folder name is required.')
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
        throw new Error(await getErrorMessage(response, 'Failed to update folder name.'))
      }

      setEditingFolderId(null)
      setEditingName('')
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to update folder.')
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
        throw new Error(await getErrorMessage(response, 'Failed to delete folder.'))
      }
      await loadFolders()
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to delete folder.')
    } finally {
      setDeletingFolderId(null)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-3 rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 to-blue-50/30 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Folders</p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Manage your folders</h1>
          <p className="text-slate-600">Create folders and organize your recipe bookmarks.</p>
        </header>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="Enter folder name..."
              className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={isCreating}
              className="h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-900/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>+</span> Create Folder
                </span>
              )}
            </button>
          </div>
        </section>

        {folderError && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-md animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600 mt-1">{folderError}</p>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-900/5">
          <h2 className="mb-5 text-xl font-semibold text-slate-900 flex items-center gap-2">
            Your folders
          </h2>

          {isLoadingFolders ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-slate-600">Loading folders...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-slate-100 p-4">
                <span className="text-4xl">📁</span>
              </div>
              <p className="mt-4 text-slate-600">No folders yet.</p>
              <p className="mt-2 text-sm text-slate-500">Create your first folder to start organizing recipes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder, index) => {
                const isEditing = editingFolderId === folder.folder_id
                const isDeleting = deletingFolderId === folder.folder_id

                return (
                  <article
                    key={folder.folder_id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-3">
                          <span className="text-2xl">📁</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                              autoFocus
                            />
                          ) : (
                            <h3 className="text-lg font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                              {folder.name}
                            </h3>
                          )}
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            {/* <span>📅</span> */}
                            {new Date(folder.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onOpenFolder(folder.folder_id)}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                        >
                          Open
                        </button>

                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRenameFolder(folder.folder_id)}
                              disabled={isUpdating}
                              className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFolderId(null)
                                setEditingName('')
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-95"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startRename(folder)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-95"
                          >
                            Rename
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(folder.folder_id)}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-all duration-200 hover:bg-red-50 hover:border-red-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isDeleting ? 'Deleting...' : ' Delete'}
                        </button>
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

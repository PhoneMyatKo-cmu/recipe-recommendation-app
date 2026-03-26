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
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-slate-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Folders</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Manage your folders</h1>
          <p className="text-slate-600">Create, rename, delete folders and open a folder detail page.</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="New folder name"
              className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-slate-800"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={isCreating}
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Create Folder
            </button>
          </div>
        </section>

        {folderError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {folderError}
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Your folders</h2>

          {isLoadingFolders ? (
            <p className="text-slate-600">Loading folders...</p>
          ) : folders.length === 0 ? (
            <p className="text-slate-600">No folders yet. Create your first folder.</p>
          ) : (
            <div className="space-y-3">
              {folders.map((folder) => {
                const isEditing = editingFolderId === folder.folder_id
                const isDeleting = deletingFolderId === folder.folder_id

                return (
                  <article key={folder.folder_id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-slate-800 lg:w-80"
                          />
                        ) : (
                          <h3 className="text-lg font-semibold text-slate-900">{folder.name}</h3>
                        )}
                        <p className="text-xs text-slate-500">
                          Created: {new Date(folder.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenFolder(folder.folder_id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View Folder Detail
                        </button>

                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRenameFolder(folder.folder_id)}
                              disabled={isUpdating}
                              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Save Name
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFolderId(null)
                                setEditingName('')
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startRename(folder)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Rename
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteFolder(folder.folder_id)}
                          disabled={isDeleting}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Delete
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

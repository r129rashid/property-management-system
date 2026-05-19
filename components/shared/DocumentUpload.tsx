"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, FileText, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface DocumentUploadProps {
  recordId: string
  userId: string
}

interface UploadedFile {
  name: string
  path: string
  url: string
}

export function DocumentUpload({ recordId, userId }: DocumentUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB")
      return
    }

    setUploading(true)
    const path = `${userId}/${recordId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("documents").upload(path, file)
    if (error) {
      toast.error(error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path)
    setFiles((prev) => [
      ...prev,
      { name: file.name, path, url: urlData.publicUrl },
    ])
    toast.success(`${file.name} uploaded`)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleDelete = async (f: UploadedFile) => {
    const { error } = await supabase.storage.from("documents").remove([f.path])
    if (error) {
      toast.error(error.message)
      return
    }
    setFiles((prev) => prev.filter((x) => x.path !== f.path))
    toast.success(`${f.name} removed`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Documents
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-7 text-xs"
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleUpload}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">No documents uploaded.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.path}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
            >
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline truncate"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(f)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

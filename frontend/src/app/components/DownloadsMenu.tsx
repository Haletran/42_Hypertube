"use client"
import { useEffect, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import Cookies from 'js-cookie';
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Progress } from "@/app/components/ui/progress"
import { useMovieContext } from "@/contexts/MovieContext"

interface DownloadItem {
  id: string
  name: string
  progress: number
  status: string
}

export function DownloadsDropdown() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getMovie } = useMovieContext()
  const token = Cookies.get('token');

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await fetch("http://localhost:3333/api/stream/current_download", { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        })
        if (!response.ok) throw new Error("Failed to fetch downloads")
        const data = await response.json()
        const mappedData = await Promise.all((data.streams || []).map(async (stream) => {
            try {
                const movieDetails = await getMovie(stream.id);
                return {
                    ...stream,
                    name: movieDetails?.original_title || stream.id,
                    progress: stream.progress || 0,
                    status: stream.status || "unknown",
                };
            } catch (error) {
                console.error(`Error getting movie name for ${stream.id}:`, error);
                return stream;
            }
        }));
        setDownloads(mappedData || []);
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching downloads:", error)
        setIsLoading(false)
      }
    }
    fetchDownloads()
    const intervalId = setInterval(fetchDownloads, 3000)
    return () => clearInterval(intervalId)
  }, [])

  const getStatusColor = (status: DownloadItem["status"]) => {
    switch (status) {
      case "downloading":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Download className="h-5 w-5" />
          {downloads.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {downloads.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
    <DropdownMenuContent className="bg-zinc-900 border border-zinc-800 rounded-md p-2 shadow-xl animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 w-70" align="end" >
      <DropdownMenuLabel>Downloads</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : downloads.length === 0 ? (
        <div className="px-2 py-4 text-center text-sm text-muted-foreground">No active downloads</div>
      ) : (
        <DropdownMenuGroup>
        {downloads.map((download) => (
          <DropdownMenuItem key={download.id} className="flex flex-col items-start p-2">
            <div className="flex w-full justify-between">
            <span className="font-medium truncate max-w-[220px]">
              {`${download.name}` || `${download.id}`}
            </span>
            <span className={`text-xs px-2 rounded-full ${getStatusColor(download.status)} text-white`}>
              {download.status}
            </span>
            </div>
            <div className="w-full mt-1">
            <Progress value={download.progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{`${download.progress}%`}</span>
            </div>
          </DropdownMenuItem>
        ))}
        </DropdownMenuGroup>
      )}
    </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState, useEffect } from "react"
import { X, Loader, Download, AlertCircle, Info } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/app/components/ui/button"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Badge } from "@/app/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"

interface Torrent {
  id: number
  name: string
  seeders: number
  leechers: number
  size: string
  info_hash: string
  quality?: string
  language?: string
  provider?: string
}

interface ProvidersTorrents {
  [key: string]: Torrent[]
}

interface TorrentModalProps {
  isOpen: boolean
  onClose: () => void
  movieTitle: string
  movieId: number
  providersTorrents: ProvidersTorrents | null
  isLoading: boolean
  error?: string
  onSelectTorrent: (infoHash: string, movieId: number) => void
}

export function TorrentModal({
  isOpen,
  onClose,
  movieTitle,
  movieId,
  providersTorrents,
  isLoading,
  error,
  onSelectTorrent,
}: TorrentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [sortBy, setSortBy] = useState<"seeders">("seeders")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (providersTorrents && Object.keys(providersTorrents).length > 0) {
      setSelectedProvider(Object.keys(providersTorrents)[0])
    }
  }, [providersTorrents])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const getSortedTorrents = (torrents: Torrent[]) => {
    return [...torrents].sort((a, b) => {
      if (sortBy === "seeders") {
        return sortOrder === "desc" ? b.seeders - a.seeders : a.seeders - b.seeders
      } else {
        return sortOrder === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      }
    })
  }

  const getQualityColor = (quality: string) => {
    if (quality?.includes("4K") || quality?.includes("2160")) return "bg-purple-500"
    if (quality?.includes("1080")) return "bg-blue-500"
    if (quality?.includes("720")) return "bg-green-500"
    if (quality?.includes("BRRip") || quality?.includes("BluRay")) return "bg-yellow-500"
    if (quality?.includes("WEBRip") || quality?.includes("WEB-DL")) return "bg-orange-500"
    if (quality?.includes("CAM")) return "bg-red-500"
    return "bg-zinc-500"
  }

  const toggleSort = (field: "seeders") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

const formatFileSize = (sizeStr: string): string => {
    if (!sizeStr || sizeStr.trim().toUpperCase() === "N/A") return "N/A"
    const sizeMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*([KMGT]?B)/i)
    if (!sizeMatch) return sizeStr
    const [_, size, unit] = sizeMatch
    return `${parseFloat(size).toFixed(2)} ${unit.toUpperCase()}`
}

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-100">
                <span className="text-blue-400">{movieTitle}</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            {/* Error state */}
            {error && (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/20 text-red-400 mb-4">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Erreur lors du chargement</h3>
                <p className="text-zinc-400">{error}</p>
                <Button variant="outline" className="mt-4 border-zinc-700 hover:bg-zinc-800" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            )}
            {/* Content */}
            {!isLoading && !error && providersTorrents && (
              <>
                {Object.keys(providersTorrents).length > 0 ? (
                  <Tabs
                    defaultValue={selectedProvider}
                    onValueChange={setSelectedProvider}
                    className="w-full flex flex-col flex-1 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-zinc-800 overflow-x-auto">
                      <TabsList className="bg-zinc-800/50 p-1">
                        {Object.keys(providersTorrents).map((provider) => (
                          <TabsTrigger
                            key={provider}
                            value={provider}
                            className="data-[state=active]:bg-white data-[state=active]:text-zinc-700"
                          >
                            {provider === "all" ? "Tous" : provider.toUpperCase()}
                            <Badge variant="secondary" className="ml-2 bg-zinc-700 text-zinc-300">
                              {providersTorrents[provider].length}
                            </Badge>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                      <div className="text-sm text-zinc-400">
                        {providersTorrents[selectedProvider]?.length || 0} sources
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400">Sort by :</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`px-2 py-1 h-auto ${sortBy === "seeders" ? "text-blue-400" : "text-zinc-400"}`}
                          onClick={() => toggleSort("seeders")}
                        >
                          Seeders {sortBy === "seeders" && (sortOrder === "desc" ? "↓" : "↑")}
                        </Button>
                      </div>
                    </div>

                    {/* Torrent list */}
                    <div className="flex-1 overflow-hidden">
                      {Object.keys(providersTorrents).map((provider) => (
                        <TabsContent key={provider} value={provider} className="mt-0 h-full overflow-hidden">
                          <ScrollArea className="h-[calc(50vh-120px)] overflow-hidden">
                            <div className="p-4 space-y-3">
                              {providersTorrents[provider].length > 0 ? (
                                getSortedTorrents(providersTorrents[provider]).map((torrent, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center p-3 rounded-md bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-medium text-zinc-100 truncate">{torrent.name.length > 10 ? `${torrent.name.slice(0, 50)}...` : torrent.name}</p>
                                        {torrent.quality && (
                                          <Badge className={`${getQualityColor(torrent.quality)} text-white`}>
                                            {torrent.quality}
                                          </Badge>
                                        )}
                                        {torrent.language && (
                                          <Badge className="bg-zinc-700 text-zinc-200">{torrent.language}</Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-y-1 text-xs">
                                        <span className="text-zinc-400">
                                          <span className="font-medium">{formatFileSize(torrent.size)}</span>
                                        </span>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-green-400 flex items-center">
                                                <span className="mr-1">↑</span>
                                                <span className="font-medium">{torrent.seeders}</span>
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <p>{torrent.seeders} seeders</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="text-red-400 flex items-center">
                                                <span className="mr-1">↓</span>
                                                <span className="font-medium">{torrent.leechers}</span>
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              <p>{torrent.leechers} leechers</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        {provider === "all" && torrent.provider && (
                                          <span className="text-zinc-500">{torrent.provider.toUpperCase()}</span>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="bg-white hover:bg-gray-300 text-black whitespace-nowrap"
                                      onClick={() => onSelectTorrent(torrent.info_hash, movieId)}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Sélectionner
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-10">
                                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-4">
                                    <Info className="h-6 w-6 text-zinc-400" />
                                  </div>
                                  <h3 className="text-lg font-medium text-zinc-300 mb-2">Aucune source trouvée</h3>
                                  <p className="text-zinc-500">
                                    Aucune source disponible sur{" "}
                                    {provider === "all" ? "aucun fournisseur" : provider.toUpperCase()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-4">
                      <Info className="h-6 w-6 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-300 mb-2">Aucune source disponible</h3>
                    <p className="text-zinc-500">Nous n'avons trouvé aucune source pour ce film</p>
                    <Button variant="outline" className="mt-4 border-zinc-700 hover:bg-zinc-800" onClick={onClose}>
                      Fermer
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


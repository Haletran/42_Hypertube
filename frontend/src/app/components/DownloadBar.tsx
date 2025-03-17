import { motion } from "framer-motion"
import { Download } from 'lucide-react'
import { Progress } from "@/app/components/ui/progress"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/app/components/ui/sheet"

const download = [
    {
        name: "The Shawshank Redemption",
        size: "1.5GB",
        progress: 50,
        speed: "1.5MB/s",
        eta: "2h 30m",
    },
    {
        name: "Inception",
        size: "2.1GB",
        progress: 75,
        speed: "2.2MB/s",
        eta: "45m",
    },
    {
        name: "The Dark Knight",
        size: "2.8GB",
        progress: 25,
        speed: "1.1MB/s",
        eta: "3h 10m",
    }
]


export const DownloadBar = ({ downloads }: { downloads: any[] }) => {

    // for testing purposes (use MOCK data)
    downloads = download

    return (
        <Sheet>
            <SheetTrigger>
                <Download className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Current download :</SheetTitle>
                    <SheetDescription className="text-gray-500">
                        Here is the list of your current downloads
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                    {!downloads.length && (
                        <div className="text-center text-gray-500">No downloads yet</div>
                    )}
                    {downloads.map((item, index) => (
                        <motion.div
                            key={index}
                            className="p-3 border rounded-md"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                ease: "easeOut"
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground">{item.size}</p>
                                </div>
                                <span className="text-xs font-medium">{item.speed}</span>
                            </div>

                            <div className="mt-1 flex justify-between items-center">
                                <Progress className="w-50 h-3 bg-gray-700" value={item.progress} max={100} />
                                <span className="text-xs text-muted-foreground">ETA: {item.eta}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}

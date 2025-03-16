import { ArrowLeft } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

export function BackButton({ backUrl }: { backUrl: string }) {
    return (
        <div className="self-start hidden sm:block">
            <Link href={backUrl} className="inline-block">
                <Button variant="ghost" size="icon" className="rounded-full dark:bg-black/50 dark:hover:bg-black/70 cursor-pointer">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to home</span>
                </Button>
            </Link>
        </div>
    );
}
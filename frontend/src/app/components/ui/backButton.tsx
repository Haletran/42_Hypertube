import { ArrowLeft } from 'lucide-react';
import { Button } from './button';
import Link from 'next/link';

export function BackButton({ backUrl }: { backUrl: string }) {
    return (
        <div className="self-start">
            <Link href={backUrl} className="inline-block">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/50 hover:bg-black/70 cursor-pointer">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back to home</span>
                </Button>
            </Link>
        </div>
    );
}
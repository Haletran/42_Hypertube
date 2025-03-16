"use client";

import { Textarea } from "@/app/components/ui/textarea";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

interface Comment {
    id: number;
    author: string;
    content: string;
    date: string;
}

const mockComments: Comment[] = [
    {
        id: 1,
        author: "MovieFan123",
        content: "This movie was absolutely amazing! The plot twists kept me on the edge of my seat the whole time.",
        date: "2023-11-15"
    },
    {
        id: 2,
        author: "CinemaLover",
        content: "The acting was superb, especially the lead's performance. Definitely deserves an award!",
        date: "2023-11-14"
    },
    {
        id: 3,
        author: "FilmCritic42",
        content: "Interesting concept but the execution was lacking. The middle part dragged on too much.",
        date: "2023-11-12"
    },
    {
        id: 4,
        author: "SciFiGuru",
        content: "The visual effects were mind-blowing! Never seen anything like this before.",
        date: "2023-11-10"
    },
    {
        id: 5,
        author: "CasualViewer",
        content: "Entertaining but forgettable. I enjoyed it while watching but wouldn't see it again.",
        date: "2023-11-08"
    }
];


export const CommentSection = ({ movie_id }: { movie_id: number }) => {
    const [comments, setComments] = useState<string[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [loading, setLoading] = useState(true)
    const [commentLoading, setCommentLoading] = useState(false)

    const fetchComments = async (movieId: number) => {
        const comments = mockComments.map(comment => comment.content);
        setComments(comments);
    }

    useEffect(() => {
        fetchComments(movie_id);
    }, [movie_id]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return

        setCommentLoading(true)
        try {
            const comment = newComment.trim();
            setComments((prev) => [comment, ...prev])
            setNewComment("")
        } catch (error) {
            console.error("Failed to add comment:", error)
        } finally {
            setCommentLoading(false)
        }
    }

    return (
        <div className="mt-5">
            <h2 className="text-xl font-semibold mb-2">Comments</h2>
            <div className="mb-6">
                <Textarea
                    placeholder="Add a comment..."
                    className="bg-zinc-900 border-zinc-700 resize-none mb-2"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || commentLoading}
                    className="bg-white hover:bg-gray-100 text-black dark:text-black dark:bg-white"
                >
                    {commentLoading ? "Posting..." : "Post Comment"}
                </Button>
            </div>
            <div className="space-y-4">
                <h3 className="font-medium text-gray-400 mb-4">
                    {comments.length === 0
                        ? "No comments yet"
                        : `${comments.length} ${comments.length === 1 ? "Comment" : "Comments"}`}
                </h3>
                {comments.length > 0 && comments.map((comment, index) => (
                    <div key={index} className="bg-zinc-800 p-4 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-lg font-medium">{mockComments[index]?.author || "User"}</p>
                            <p className="text-sm text-muted-foreground text-gray-400">
                                {mockComments[index]?.date || new Date().toISOString().split('T')[0]}
                            </p>
                        </div>
                        <p>{comment}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
"use client";
import { Textarea } from "@/app/components/ui/textarea";
import { useEffect, useState } from "react";
import { Button } from "./ui/button"
import Cookies from "js-cookie";
import { Comment } from "@/types";
import api from '@/utils/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"


interface User {
    id: number;
    username: string;
    email: string;
    profilePicture: string;
    language: string;
    authMethod: string;
    createdAt: string;
    updatedAt: string;
  }
  
  interface Comment {
    id: number;
    content: string;
    movieId: string;
    userId: number;
    created_at: string;
    user: User;
  }


export const CommentSection = ({ movie_id }: { movie_id: number }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [loading, setLoading] = useState(true)
    const [commentLoading, setCommentLoading] = useState(false)

    const fetchComments = async (movieId: number) => {
        setCommentLoading(true)
        try {
            const response = await api.get(`/api/comments/${movieId}`, {
                headers: {
                    Authorization: `Bearer ${Cookies.get('token')}`,
                }
            });
            if (response.status !== 200) {
                throw new Error("Failed to fetch comments");
            }
            setComments(response.data);
            setCommentLoading(false)
            console.log(response.data)
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        }
    }

    useEffect(() => {
        (async () => {
            await fetchComments(movie_id);
        })();
    }, [movie_id]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return

        setCommentLoading(true)
        try {
            const comment = newComment.trim();
            const response = await fetch(`http://localhost:3333/api/comments?id=${movie_id}&content=${comment}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify({ content: comment })
            })
            if (!response.ok) {
                throw new Error("Failed to add comment");
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
            fetchComments(movie_id);
        } catch (error) {
            console.error("Failed to add comment:", error)
        } finally {
            setCommentLoading(false)
        }
    }
      // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

    return (
        <div className="mt-5 w-full  mx-auto">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
  
        <div className="mb-6 space-y-3">
          <Textarea
            placeholder="Add a comment..."
            className="bg-zinc-900 border-zinc-700 resize-none min-h-24"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || commentLoading}
              className="bg-white hover:bg-gray-100 text-black dark:text-black dark:bg-white"
            >
              {commentLoading ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
  
        <div className="space-y-4">
          <h3 className="font-medium text-gray-400 mb-4">
            {comments.length === 0
              ? "No comments yet"
              : `${comments.length} ${comments.length === 1 ? "Comment" : "Comments"}`}
          </h3>
  
          {comments.length > 0 &&
            comments.map((comment, index) => (
              <div
                key={index}
                className="bg-zinc-800/80 p-5 rounded-lg border border-zinc-700 transition-all hover:border-zinc-600"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border border-zinc-700">
                    <AvatarImage src={comment?.user?.profilePicture} alt={comment?.user?.username || "User"} />
                  </Avatar>
  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold ">{comment?.user?.username || "User"}</p>
                      <p className="text-xs text-gray-400">{formatDate(comment?.created_at)}</p>
                    </div>
  
                    <p className="text-gray-200 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    )
}
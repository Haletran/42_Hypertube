"use client";
import { SearchBar } from "../components/SearchBar";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SearchPage() {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="container mx-auto p-2">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                onAnimationComplete={() => setIsVisible(true)}
            >
                <SearchBar />
            </motion.div>
        </div>
    );
}
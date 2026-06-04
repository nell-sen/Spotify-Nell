import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 0.6 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse"
      }}
      className={cn("bg-white/10 rounded-md", className)}
    />
  );
}

export function SongSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 glass-card rounded-2xl mb-3">
      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  );
}

export function AlbumSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Document<T> {
  pageContent: string;
  metadata: T;
}

export function transformToDocuments(rawDocs: { name: string; url: string }[]): Document<Record<string, any>>[] {
  return rawDocs.map(doc => ({
      pageContent: `Name: ${doc.name}, URL: ${doc.url}`, // Adjust formatting as needed
      metadata: {
          name: doc.name,
          url: doc.url
      }
  }));
}
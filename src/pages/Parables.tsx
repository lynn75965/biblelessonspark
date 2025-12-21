/**
 * Parables Page
 * Standalone Modern Parable Generator (DevotionalSpark)
 * 
 * Route: /parables
 * Context: standalone (contemplative, personal reflection)
 * 
 * @version 1.0.0
 * @created 2025-12-21
 */

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ParableGenerator } from "@/components/ParableGenerator";

export default function Parables() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Modern Parable Generator</h1>
          <p className="text-muted-foreground">
            Create contemporary parables in the style of Jesus' teaching. 
            Perfect for personal reflection, devotional reading, and heart examination.
          </p>
        </div>
        
        {/* Standalone context: contemplative, personal - NOT classroom teaching */}
        <ParableGenerator context="standalone" />
      </main>
      
      <Footer />
    </div>
  );
}

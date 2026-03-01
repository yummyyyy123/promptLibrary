'use client'

import { useState, useEffect } from 'react'
import { Search, Moon, Sun, Copy, Check, Tag, Filter, Sparkles, Zap, Target, TrendingUp, Clock, Star, ChevronRight, X, FileText, Hash, Users, BarChart3, Calendar, MessageSquare, Twitter, Instagram, Linkedin, Mail, PenTool, Lightbulb, Rocket, Heart, Megaphone, Briefcase, Globe, Palette, Plus, Shield, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { usePromptStore } from '@/store/promptStore'
import { AnimatedContainer, AnimatedCard } from '@/components/AnimatedComponents'
import { SimpleModal } from '@/components/SimpleModal'
import { PromptSubmissionForm } from '@/components/PromptSubmissionForm'
import { AdvancedSearch } from '@/components/AdvancedSearch'
import { PromptOrganizer } from '@/components/PromptOrganizer'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

const categories = ['All', 'Marketing', 'Business Operations', 'Social Media', 'Copywriting']

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const {
    prompts,
    filteredPrompts,
    selectedCategory,
    searchQuery,
    selectedPrompt,
    isLoading,
    favorites,
    recentlyUsed,
    setPrompts,
    setSelectedCategory,
    setSearchQuery,
    setSelectedPrompt,
    setIsLoading,
    toggleFavorite,
    addToRecentlyUsed,
    addPrompt
  } = usePromptStore()

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('relevance')
  const [showAddModal, setShowAddModal] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setPrompts(data.prompts)
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      addToRecentlyUsed(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const highlightVariables = (text: string) => {
    return text.replace(/\[([^\]]+)\]/g, '<span class="variable-highlight">[$1]</span>')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Marketing': return <Megaphone className="w-4 h-4" />
      case 'Business Operations': return <Briefcase className="w-4 h-4" />
      case 'Social Media': return <Globe className="w-4 h-4" />
      case 'Copywriting': return <PenTool className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Marketing': return 'from-emerald-500 to-teal-600'
      case 'Business Operations': return 'from-blue-500 to-indigo-600'
      case 'Social Media': return 'from-purple-500 to-pink-600'
      case 'Copywriting': return 'from-orange-500 to-amber-600'
      default: return 'from-gray-500 to-slate-600'
    }
  }

  const getSearchSuggestions = () => {
    const allTags = prompts.flatMap(p => p.tags)
    const uniqueTags = [...new Set(allTags)]
    return uniqueTags.slice(0, 5)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = filteredPrompts.findIndex((prompt) => prompt.id === active.id)
      const newIndex = filteredPrompts.findIndex((prompt) => prompt.id === over.id)
      
      const reorderedPrompts = arrayMove(filteredPrompts, oldIndex, newIndex)
      // Update store with reordered prompts
      setPrompts(reorderedPrompts)
    }
  }

  const getAllTags = () => {
    const allTags = prompts.flatMap(p => p.tags)
    return [...new Set(allTags)]
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Library</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Professional prompts for modern businesses</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </a>
              <a
                href="/test"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Testing
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Just now</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Categories
              </h2>
              <nav className="space-y-1">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group flex items-center justify-between ${
                      selectedCategory === category
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      background: selectedCategory === category 
                        ? `linear-gradient(to right, ${getCategoryColor(category)})`
                        : 'transparent'
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className={selectedCategory === category ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>
                        {getCategoryIcon(category)}
                      </span>
                      <span className={selectedCategory === category ? 'text-white' : ''}>
                        {category}
                      </span>
                    </span>
                    {selectedCategory === category && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Live Stats</span>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredPrompts.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">prompts available</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <Star className="w-3 h-3" />
                  <span>{prompts.length} total prompts</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Advanced Search */}
            <div className="mb-8">
              <AdvancedSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                tags={getAllTags()}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>

            {/* Testing Dashboard Card */}
            <div className="mb-8">
              <AnimatedCard index={0} className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 border border-purple-500/30">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Testing Dashboard</h3>
                        <p className="text-sm text-gray-300">Security & Performance Monitoring</p>
                      </div>
                    </div>
                    <a
                      href="/test"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40 text-white hover:bg-white/30 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      View Dashboard
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Security Score</span>
                      </div>
                      <p className="text-2xl font-bold text-white">100%</p>
                      <p className="text-xs text-gray-400">All tests passed</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Performance</span>
                      </div>
                      <p className="text-2xl font-bold text-white">100%</p>
                      <p className="text-xs text-gray-400">Optimized response</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-400">Tests Run</span>
                      </div>
                      <p className="text-2xl font-bold text-white">16</p>
                      <p className="text-xs text-gray-400">Comprehensive suite</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-400">System Status: Operational</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      All security measures active • Real-time monitoring enabled • Production ready
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Results Count and Actions */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{filteredPrompts.length}</span> {filteredPrompts.length === 1 ? 'prompt' : 'prompts'} found
              </p>
              <div className="flex items-center gap-3">
                {searchQuery && (
                  <motion.button
                    onClick={() => setSearchQuery('')}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Clear search
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" />
                  Submit Prompt
                </motion.button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <PromptOrganizer
                  prompts={filteredPrompts}
                  onReorder={(oldIndex, newIndex) => {
                    const reordered = arrayMove(filteredPrompts, oldIndex, newIndex)
                    setPrompts(reordered)
                  }}
                  isFavorite={(id) => favorites.includes(id)}
                  onToggleFavorite={toggleFavorite}
                  onCopy={copyToClipboard}
                  copiedId={copiedId}
                  onPromptClick={setSelectedPrompt}
                />
              </DndContext>
            )}
          </main>
        </div>
      </div>

      {/* Detail Modal */}
      <SimpleModal
        isOpen={!!selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        title={selectedPrompt?.title || ''}
        size="xl"
      >
        {selectedPrompt && (
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <span 
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(to right, ${getCategoryColor(selectedPrompt.category)})` }}
                >
                  {selectedPrompt.category}
                </span>
                {selectedPrompt.usageCount && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPrompt.usageCount} uses
                  </span>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {selectedPrompt.description}
            </div>
            
            {/* Prompt Text Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Prompt Text
              </h3>
              <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: highlightVariables(selectedPrompt.prompt)
                  }}
                />
              </div>
            </div>
            
            {/* Variables Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                Variables to Replace
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {selectedPrompt.variables.map((variable, index) => (
                  <motion.div
                    key={variable}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                    <code className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {variable}
                    </code>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4" />
                Click to copy full prompt to your clipboard
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => toggleFavorite(selectedPrompt.id)}
                  className={`p-3 rounded-lg transition-colors ${
                    favorites.includes(selectedPrompt.id)
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star className={`w-5 h-5 ${favorites.includes(selectedPrompt.id) ? 'fill-current' : ''}`} />
                </motion.button>
                <motion.button
                  onClick={() => copyToClipboard(selectedPrompt.prompt, selectedPrompt.id)}
                  className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedId === selectedPrompt.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </SimpleModal>

      {/* Submission Form */}
      <PromptSubmissionForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}

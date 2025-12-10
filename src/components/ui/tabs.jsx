import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef(({ className, defaultValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue)
  
  const handleValueChange = (newValue) => {
    setValue(newValue)
    if (onValueChange) onValueChange(newValue)
  }

  return (
    <div
      ref={ref}
      className={cn("w-full", className)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange: handleValueChange })
        }
        return child
      })}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full",
      className
    )}
    {...props}
  >
    {React.Children.map(props.children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { 
          selectedValue: value, 
          onClick: () => onValueChange(child.props.value) 
        })
      }
      return child
    })}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, selectedValue, onClick, ...props }, ref) => (
  <button
    ref={ref}
    role="tab"
    aria-selected={value === selectedValue}
    onClick={onClick}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow w-full",
      value === selectedValue && "bg-background text-foreground shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, selectedValue, ...props }, ref) => {
  if (value !== selectedValue && !props.value) return null // Props.value check for initial render if context missing
  // Simple check: if this component's value prop matches the parent's current value state
  
  // Actually, strictly speaking, this naive implementation needs context to work perfectly nested. 
  // But for this simple app, we can pass props down or just use conditional rendering in the parent.
  // Let's rely on the parent Tabs cloning.
  
  // Fix: The cloning in Tabs doesn't reach TabsContent if it's not a direct child.
  // For this specific app structure, TabsContent usually is a direct child of Tabs.
  // However, `TabsList` is also a child.
  
  // Re-write Tabs to be a bit more robust with Context for deeper trees if needed, 
  // but for now let's use a Context to share state.
  
  return null; // Will be replaced by Context implementation below
})

// --- Context Implementation for Tabs ---
const TabsContext = React.createContext({})

const TabsRoot = React.forwardRef(({ className, defaultValue, onValueChange, children, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue)

  const handleValueChange = (newValue) => {
    setValue(newValue)
    if (onValueChange) onValueChange(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
})
TabsRoot.displayName = "Tabs"

const TabsListContext = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full",
      className
    )}
    {...props}
  />
))
TabsListContext.displayName = "TabsList"

const TabsTriggerContext = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  const isSelected = context.value === value
  
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected && "bg-background text-foreground shadow",
        className
      )}
      {...props}
    />
  )
})
TabsTriggerContext.displayName = "TabsTrigger"

const TabsContentContext = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (context.value !== value) return null

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TabsContentContext.displayName = "TabsContent"

export { TabsRoot as Tabs, TabsListContext as TabsList, TabsTriggerContext as TabsTrigger, TabsContentContext as TabsContent }

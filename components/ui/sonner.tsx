"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          title: 'font-semibold',
          toast: 'group toast group-[.toaster]:bg-neutral-950 group-[.toaster]:text-neutral-50 group-[.toaster]:border-neutral-800 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-neutral-400',
          actionButton: 'group-[.toast]:bg-neutral-50 group-[.toast]:text-neutral-900',
          cancelButton: 'group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-400',
          success: 'group-[.toaster]:!bg-green-900 group-[.toaster]:!border-green-800 group-[.toaster]:!text-green-50',
          error: 'group-[.toaster]:!bg-red-900 group-[.toaster]:!border-red-800 group-[.toaster]:!text-red-50',
          warning: 'group-[.toaster]:!bg-yellow-900 group-[.toaster]:!border-yellow-800 group-[.toaster]:!text-yellow-50',
          info: 'group-[.toaster]:!bg-blue-900 group-[.toaster]:!border-blue-800 group-[.toaster]:!text-blue-50',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-neutral-400" />,
      }}
      {...props}
    />
  )
}

export { Toaster }

"use client";

import { toast, useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { socket } from "@/socket";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { usePathname } from "next/navigation";
import { chatHrefConstructor } from "@/lib/utils";
import { getUserById } from "@/actions/user";

export function Toaster() {
  const { toasts } = useToast();
  const user = useUser();
  const pathName = usePathname();

  useEffect(() => {
    async function sendToast(senderId: string, message: string) {
      if (!user?.id) return;
      if (pathName !== "/" + chatHrefConstructor(senderId, user.id)) {
        const user = await getUserById(senderId);
        toast({
          title: `New Message from ${user?.name}:`,
          description: message
        });
      }
    }

    socket.on("sendToastClient", sendToast);

    return () => {
      socket.off("sendToastClient", sendToast);
    };
  }, [user, pathName]);

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      {/* <ToastViewport /> */}
      <ToastViewport className="grid gap-2" /> 
    </ToastProvider>
  );
}
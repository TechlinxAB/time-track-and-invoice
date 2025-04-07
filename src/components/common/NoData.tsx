
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

type NoDataProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
};

export const NoData = ({ message, actionLabel, onAction, icon }: NoDataProps) => {
  return (
    <div className="text-center py-12 space-y-4 animate-fade-in bg-white rounded-xl shadow-sm p-8 border border-border/40">
      <div className="inline-block p-4 rounded-full bg-muted/30 mb-2">
        {icon || <Users className="h-10 w-10 text-muted-foreground" />}
      </div>
      <p className="text-muted-foreground text-lg">{message}</p>
      <Button 
        className="mt-2 bg-success hover:bg-success/90 text-success-foreground" 
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
};

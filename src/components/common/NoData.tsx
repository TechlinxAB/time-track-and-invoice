
import { Button } from "@/components/ui/button";

type NoDataProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export const NoData = ({ message, actionLabel, onAction }: NoDataProps) => {
  return (
    <div className="text-center py-12 space-y-4 animate-fade-in">
      <div className="inline-block p-4 rounded-full bg-muted mb-2">
        <svg className="h-10 w-10 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-muted-foreground text-lg">{message}</p>
      <Button 
        variant="outline" 
        className="mt-2 border-success text-success hover:bg-success/10" 
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
};

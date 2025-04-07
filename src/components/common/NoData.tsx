
import { Button } from "@/components/ui/button";

type NoDataProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export const NoData = ({ message, actionLabel, onAction }: NoDataProps) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
      <Button 
        variant="link" 
        className="mt-2 text-success" 
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
};

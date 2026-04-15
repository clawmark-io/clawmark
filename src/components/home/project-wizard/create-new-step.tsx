import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CreateNewStepProps = {
  onBack: () => void;
  onCreate: (name: string) => void;
};

export function CreateNewStep({ onBack, onCreate }: CreateNewStepProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation("projects");
  const { t: tc } = useTranslation("common");

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-0.5 rounded hover:bg-[var(--surface-overlay)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          {t("wizardCreateNewTitle")}
        </DialogTitle>
        <DialogDescription>{t("wizardCreateNewPrompt")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("projectNamePlaceholder")}
          autoFocus
        />
        <DialogFooter className="mt-4">
          <button type="button" className="btn btn-outline" onClick={onBack}>{tc("cancelButton")}</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{tc("createButton")}</button>
        </DialogFooter>
      </form>
    </>
  );
}

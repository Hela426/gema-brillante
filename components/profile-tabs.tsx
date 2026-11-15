"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { UserRound, Heart, Images, Feather, LockKeyhole, Palette, Music2, BookOpen } from "lucide-react";

type Tab = "perfil" | "ficha" | "vinculos" | "recuerdos" | "notas" | "privado";
const TabContext = createContext<(tab: Tab) => void>(() => {});

export function ProfileTabLink({ target, children, className, title }: {
  target: Tab; children: ReactNode; className?: string; title?: string;
}) {
  const select = useContext(TabContext);
  return <button type="button" onClick={() => select(target)} className={className} title={title}>{children}</button>;
}

export default function ProfileTabs({ sidebar, profilePanel, characterPanel, relationsPanel, galleryPanel, notesPanel, privatePanel }: {
  sidebar: ReactNode; profilePanel: ReactNode; characterPanel: ReactNode; relationsPanel: ReactNode;
  galleryPanel: ReactNode; notesPanel: ReactNode; privatePanel: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("perfil");
  const tabs: { id: Tab; label: string; icon: typeof UserRound; panel: ReactNode }[] = [
    { id: "perfil", label: "Perfil", icon: UserRound, panel: profilePanel },
    { id: "ficha", label: "Ficha del personaje", icon: BookOpen, panel: characterPanel },
    { id: "vinculos", label: "Vínculos", icon: Heart, panel: relationsPanel },
    { id: "recuerdos", label: "Recuerdos", icon: Images, panel: galleryPanel },
    { id: "notas", label: "Anotaciones", icon: Feather, panel: notesPanel },
    ...(privatePanel ? [{ id: "privado" as const, label: "Archivo privado", icon: LockKeyhole, panel: privatePanel }] : []),
  ];
  const active = tabs.find(item => item.id === tab) || tabs[0];
  return (
    <TabContext.Provider value={setTab}>
      <nav aria-label="Apartados del perfil" className="profile-tabs-bar">
        {tabs.map(({id, label, icon: Icon}) => (
          <button key={id} type="button" aria-pressed={active.id === id} onClick={() => setTab(id)} className="profile-tab-button">
            <Icon size={15} aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>
      <div className="profile-content-layout">
        {sidebar}
        <section className="min-w-0 space-y-5" aria-label={active.label}>
          {active.panel}
        </section>
      </div>
    </TabContext.Provider>
  );
}

export function ProfileSettingsTabs({ identity, appearance, personality, music }: {
  identity: ReactNode; appearance: ReactNode; personality: ReactNode; music: ReactNode;
}) {
  const [tab, setTab] = useState("identity");
  const options = [
    { id: "identity", label: "Identidad y fotografías", icon: UserRound, panel: identity },
    { id: "appearance", label: "Estética y flores", icon: Palette, panel: appearance },
    { id: "personality", label: "Mi universo", icon: Heart, panel: personality },
    { id: "music", label: "Banda sonora", icon: Music2, panel: music },
  ];
  return <div className="space-y-5">
    <nav aria-label="Configuración del perfil" className="profile-tabs-bar">
      {options.map(({id,label,icon:Icon}) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className="profile-tab-button"><Icon size={16}/>{label}</button>)}
    </nav>
    {options.map(({id,panel,label}) => <section key={id} hidden={tab !== id} aria-label={label}>{panel}</section>)}
  </div>;
}

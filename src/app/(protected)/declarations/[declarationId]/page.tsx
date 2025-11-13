import { notFound } from "next/navigation";
import { getDeclarationById } from "@/app/_actions/declarations";
import { DeclarationClient } from "./_components/client";

interface PageProps {
  params: {
    declarationId: string;
  };
}

export default async function DeclarationPage({ params }: PageProps) {
  const { declarationId } = await params;

  const declaration = await getDeclarationById(declarationId);

  if (!declaration) {
    notFound();
  }

  return <DeclarationClient declaration={declaration} />;
}

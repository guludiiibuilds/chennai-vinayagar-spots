import SpotDetailClient from "./SpotDetailClient";

export default async function SpotDetailPage({ params }) {
  const { id } = await params;
  return <SpotDetailClient id={id} />;
}

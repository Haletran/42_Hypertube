import Image from "next/image"

export default async function NotFound() {

  async function fetchGif() {
    // this is not my API key so idc
    const res = await fetch("https://api.giphy.com/v1/gifs/random?api_key=5oLXGhIOw5r18zmB6XDUpaUX3VqWVKdy&tag=computer");
    const data = await res.json();
    return data.data.images.original.url;
  }
  const gifUrl = await fetchGif();

  return (
    <div className="flex flex-col items-center justify-center w-full mt-50 px-4 text-center">
      <div className="flex flex-col items-center justify-center">
        <Image src={gifUrl} alt="404" width={600} height={600} className="mb-4" />
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      </div>
    </div>
  )
}

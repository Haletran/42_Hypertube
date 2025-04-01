import { SearchBar } from "../components/SearchBar";
import { Navbar } from "@/app/components/ui/navbar";

export default async function SearchPage() {

    return (
        <div className="container mx-auto p-4">
            <Navbar />
            <SearchBar />
        </div>
    );
}
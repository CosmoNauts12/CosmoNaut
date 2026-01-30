import Image from "next/image";


export default function Astronaut() {
return (
<div className="astronaut-float">
<Image src="/astronaut.png" alt="Astronaut" width={300} height={300} />
</div>
);
}
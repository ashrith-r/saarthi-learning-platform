
export function convertYoutubeLink(url){

    // Already embed → return as is
    if(url.includes("/embed/")) return url;

    let id = "";

    // watch?v= format
    if(url.includes("watch?v=")){
        id = url.split("watch?v=")[1].split("&")[0];
    }

    // short youtu.be format
    else if(url.includes("youtu.be/")){
        id = url.split("youtu.be/")[1].split("?")[0];
    }

    if(id){
        return `https://www.youtube.com/embed/${id}`;
    }

    // Not YouTube
    return url;
}

export function getImage(files)
{
    if(!files ) return null;
    let file = files[0];
        if(!file ) return null;

    return {
        url:file.path,
        filename:file.filename,
    }
}

import {log} from "./index";
import {Level} from "./logging";

// todo: finish this stuff here, lol

const image_data: Array<{ id: any; url: any; attribution: string }> = [];
let annos: any[] = [];

interface id_event_schema {
    "id": string;
    "media_source": string | URL;
    "bbox": [];
    "category": string;
    "supercategory": string;
    "ML_id"?: string | number;
    "username"?: string;
    "last_modified"?: string;
    "image_data": typeof image_data;
    "annos": any[];
    "image_id_to_annotations": any;
}

class idEvent implements id_event_schema {

    "id": string;
    "media_source": string | URL;
    "bbox": [];
    "category": string;
    "supercategory": string;
    "ML_id"?: string | number;
    "image_data": typeof image_data;
    "annos": any[];
    "image_id_to_annotations" = {};

    constructor(id, media_source, bbox, category, ML_id) {
        this.id = id;
        this.media_source = media_source;
        this.bbox = bbox;
        this.category = category;
        this.ML_id = ML_id;
        this.image_data = image_data;
        this.annos = annos;
    }

    _construct_event = () => {
        const _user_annos: any[] = annos;

        this.image_data.forEach((image_info: { id: string | number }) => {
            annos = annos.concat(this.image_id_to_annotations[image_info.id]);
        });

        _user_annos.forEach(anno => {
            anno["username"] = "username";
            anno["user_id"] = "user_id";
        });
    };
}

// console.log("POSTing " + annos.length + " annotations...");

/*
    const rawResponse = await fetch(POST_URL, {
        method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        body: JSON.stringify(test_user_annos)
    });

    await rawResponse.json();

    alert("Uploaded a total of " + annos.length + " annotations to " + POST_URL);

    document.getElementById("exportAnnos").blur();

    });
*/

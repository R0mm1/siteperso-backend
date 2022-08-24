import Photo from "../contracts/Photo";
import axios, {AxiosRequestConfig} from "axios";
import PhotoExif from "../contracts/PhotoExif";
import Photoset from "../contracts/Photoset";

type FlickrPhotoInfo = {
    title: { _content: string },
    description: { _content: string }
    urls: {
        url: { type: string, _content: string }[]
    }
}

type FlickrPhotoExif = {
    tag: string
    label: string
    raw: { _content: string | number }
}

type FlickrPhotosetPhoto = {
    url_s: string,
    url_m: string,
    title: string,
    id: string
}
type FlickrPhotoset = {
    photo: FlickrPhotosetPhoto[]
}

type FlickrPhotosetResponse = {
    photoset: FlickrPhotoset
}

type FlickrPhotoExifResponse = {
    photo: {
        exif: FlickrPhotoExif[]
    }
}

type FlickrPhotoSizesResponse = {
    sizes: {
        size: { label: string, source: string }[]
    }
}

type FlickrPhotoInfoResponse = {
    photo: FlickrPhotoInfo
}

class Flickr {
    photoset(): Promise<Photoset> {
        return this
            .doGetRequest<FlickrPhotosetResponse>('flickr.photosets.getPhotos', {
                photoset_id: process.env.FLICKR_PHOTOSET_ID,
                extras: 'url_s,url_m'
            })
            .then(response => {
                return {
                    photos: response.photoset.photo
                }
            })
    }

    photoExif(photoId: string): Promise<PhotoExif> {
        return this
            .doGetRequest<FlickrPhotoExifResponse>('flickr.photos.getExif', {
                photo_id: photoId
            })
            .then(response => {
                const mapping: { [index: string]: keyof PhotoExif } = {
                    Model: 'camera',
                    LensModel: "lens",
                    ISO: 'iso',
                    ExposureTime: "exposureTime",
                    FNumber: "fNumber",
                    FocalLength: "focalLength"
                }
                const photoExif: PhotoExif = {}
                response.photo.exif.forEach(exif => {
                    if (typeof mapping[exif.tag] !== 'undefined') {
                        photoExif[mapping[exif.tag]] = exif.raw._content.toString()
                    }
                })
                return photoExif
            })
    }

    photo(photoId: string): Promise<Photo> {
        return Promise
            .all([
                this.doGetRequest<FlickrPhotoInfoResponse>('flickr.photos.getInfo', {
                    photo_id: photoId
                }),
                this.photoExif(photoId),
                this.doGetRequest<FlickrPhotoSizesResponse>('flickr.photos.getSizes', {
                    photo_id: photoId
                })
            ])
            .then(data => {
                return {
                    id: photoId,
                    title: data[0].photo.title._content,
                    description: data[0].photo.description._content,
                    url_m: data[2].sizes.size.find((size) => size.label === 'Medium')?.source,
                    url_b: data[2].sizes.size.find((size) => size.label === 'Medium 800')?.source,
                    flickr_page: data[0].photo.urls.url.find((url) => url.type === 'photopage')?._content,
                    exifs: data[1]
                }
            })
    }

    private doGetRequest<ResponseType>(method: string, params: { [index: string]: any }): Promise<ResponseType> {
        return axios
            .get<ResponseType>('https://www.flickr.com/services/rest/', {
                params: {
                    ...params,
                    method: method,
                    api_key: process.env.FLICKR_API_KEY,
                    user_id: process.env.FLICKR_USER_ID,
                    format: 'json',
                    nojsoncallback: true
                }
            })
            .then(response => response.data)
    }
}

export default new Flickr()

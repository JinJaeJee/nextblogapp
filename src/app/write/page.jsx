"use client"
import Image from 'next/image'
import styles from './writePage.module.css'
import { useEffect, useState } from 'react'
import ReactQuill from 'react-quill'
import "react-quill/dist/quill.bubble.css"
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebase'


const storage = getStorage(app);

const Writepage = () => {

    const { status } = useSession()
    const router = useRouter()
  
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const [file, setFile] = useState(null)
    const [media, setMedia] = useState("")
    const [title, setTitle] = useState("")


    useEffect(()=>{
        const upload = ()=> {
            const name = new Date().getTime + file.name
            const storageRef = ref(storage, name);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('Upload is paused');
                            break;
                        case 'running':
                            console.log('Upload is running');
                            break;
                    }
                }, 
                (error) => {
                    // Handle unsuccessful uploads
                 }, 
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        setMedia(downloadURL)
                    });
                }
            );
        };
        file && upload();
    }, [file])

    if (status === "loading"){
        return <div className={styles.loading}> Loading... </div>
      }
    ///// cheching user if login to write a post
      if (status === "unauthenticated"){
        router.push("/")
      }

      const slugify = (str) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    
    const haddleSubmit = async ()=>{
        const res = await fetch("/api/posts",{
            method: "POST",
            body: JSON.stringify({
                title,
                desc:value,
                img: media,
                slug: slugify(title),
                catSlug:"travel",

            })
        })
        if (res.status === 200) {
            const data = await res.json();
            router.push(`/posts/${data.slug}`);
          }

    }
   

  return (
    <div className={styles.container}>
        <input type='text' placeholder='Title' className={styles.input} onChange={e=>setTitle(e.target.value)}/>
        {/* <input type='text' placeholder='Category'  /> */}
        <div className={styles.editor}>
            <button className={styles.button} onClick={()=> setOpen(!open)}>
                <Image src="/plus.png" alt="" width={16} height={16} />
            </button>
            {open && (
                <div className={styles.add}>
                    <input 
                        type='file' 
                        id='image' 
                        onChange={e=>setFile(e.target.files[0])}
                        style={{display:"none"}}
                    />
                    <button className={styles.addButton}>
                        <label htmlFor='image'>
                            <Image src="/image.png" alt='' width={16} height={16}/>
                        </label>
                    </button>
                    <button className={styles.addButton}>
                        <Image src="/external.png" alt='' width={16} height={16}/>
                    </button>
                    <button className={styles.addButton}>
                        <Image src="/video.png" alt='' width={16} height={16}/>
                    </button>
                </div>
            )}
            <ReactQuill className={styles.textArea} theme="bubble" value={value} onChange={setValue} placeholder="Tell your story..." />
        </div>
        <button className={styles.publish} onClick={haddleSubmit}>Publish</button>
    </div>
  )
}

export default  Writepage
from PIL import Image
import os, glob
d="/media/home/zhangruiyang/pano/website/static/images"
total=0
for p in sorted(glob.glob(f"{d}/*.png")):
    im=Image.open(p).convert("RGB")
    out=p[:-4]+".jpg"
    im.save(out, "JPEG", quality=90, optimize=True, progressive=True)
    os.remove(p)
    sz=os.path.getsize(out)//1024
    total+=sz
    print(f"{os.path.basename(out)}: {sz}KB")
print(f"TOTAL: {total//1024}MB")

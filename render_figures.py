import fitz, os, glob
src="/tmp/paper_extract/imgs"
dst="/media/home/zhangruiyang/pano/website/static/images"
os.makedirs(dst,exist_ok=True)
for pdf in sorted(glob.glob(f"{src}/*.pdf")):
    name=os.path.splitext(os.path.basename(pdf))[0]
    doc=fitz.open(pdf)
    page=doc[0]
    r=page.rect
    # target ~2200px wide for crispness
    zoom=min(4.0, max(1.5, 2200/r.width))
    pix=page.get_pixmap(matrix=fitz.Matrix(zoom,zoom), alpha=False)
    out=f"{dst}/{name}.png"
    pix.save(out)
    print(f"{name}: {r.width:.0f}x{r.height:.0f} -> {pix.width}x{pix.height} ({os.path.getsize(out)//1024}KB)")
    doc.close()
# copy the png user study
import shutil
shutil.copy(f"{src}/appendix_user_study_web.png", f"{dst}/appendix_user_study_web.png")
print("copied user study png")

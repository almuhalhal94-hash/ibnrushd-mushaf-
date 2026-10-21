import sys,json
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[2],device="cpu",compute_type="int8")
import subprocess,numpy as np
pcm=np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout,np.int16).astype(np.float32)/32768
segs,_=m.transcribe(pcm,language="ar",word_timestamps=True,beam_size=5,vad_filter=False)
out=[]
for s in segs:
  for w in s.words: out.append([round(w.start,2),round(w.end,2),w.word.strip()])
json.dump(out,open(sys.argv[3],"w"),ensure_ascii=False)
for w in out: print(*w)

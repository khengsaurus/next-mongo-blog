import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import { ServerError } from "lib/server";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IResponse } from "types";
import {
  CircleLoader,
  Column,
  HomePage,
  Input,
  Row,
  StyledButton,
  StyledText,
} from "../components";
import { RowGroupEnd } from "../components/StyledComponents";
import {
  DBService,
  ErrorMessage,
  HttpRequest,
  PageTitle,
  Status,
} from "../enums";
import { AppContext, useAsync } from "../hooks";
import { HTTPService } from "../lib/client";
import { checkFileSize, checkFileType, checkOneFileSelected } from "../util";

const NewPost = () => {
  const { user } = useContext(AppContext);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [attachment, setAttachment] = useState<any>(null);
  const hasEditedSlug = useRef(false);

  useEffect(() => {
    if (!hasEditedSlug.current) {
      setSlug(title.toLocaleLowerCase().replaceAll(" ", "-"));
    }
  }, [title]);

  const _handleSave = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      if (!!user.posts?.find((post) => post.slug === slug)) {
        reject(new Error(ErrorMessage.POST_SLUG_USED));
        return;
      }
      let imageKey = "";
      if (!!attachment) {
        await HTTPService.uploadImage(attachment)
          .then((res) => {
            if (res.status === 200 && res.data?.key) {
              imageKey = res.data.key;
            } else {
              reject(new Error(ErrorMessage.FILE_UPLOAD_FAIL));
            }
          })
          .catch((err) => {
            reject(err);
            return;
          });
      }
      const createdAt = new Date().toString();
      HTTPService.makeAuthHttpReq(DBService.POSTS, HttpRequest.POST, {
        username: user.username,
        title,
        slug,
        body,
        imageKey,
        createdAt,
        updatedAt: createdAt,
      })
        .then((res) => {
          console.info(res);
          resolve(res);
        })
        .catch((err) => reject(err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment, body, slug, title, JSON.stringify(user)]);

  const _cleanup = useCallback(() => {
    setTitle("");
    setSlug("");
    setBody("");
    setAttachment(null);
  }, []);

  const { execute: handleSave, status: saveStatus } = useAsync<
    IResponse,
    ServerError
  >(_handleSave, _cleanup, (r: IResponse) => r.status === 200, false);

  const saveDisabled = useMemo(
    () =>
      !title.trim() ||
      !slug.trim() ||
      !body.trim() ||
      saveStatus !== Status.IDLE,
    [title, slug, body, saveStatus]
  );

  function renderAddImageButton() {
    const errHandler = (msg: string) => console.info(msg);

    async function handleAttachment(
      event: React.ChangeEvent<HTMLInputElement>
    ) {
      if (
        checkOneFileSelected(event, errHandler) &&
        checkFileSize(event, errHandler) &&
        checkFileType(event, errHandler)
      ) {
        setAttachment(event.target.files[0]);
      }
    }

    return (
      <IconButton
        component="label"
        style={{ padding: 0, width: 44.5, height: 44.5 }}
        disableRipple
      >
        <AddPhotoAlternateIcon />
        <input type="file" hidden onChange={handleAttachment} />
      </IconButton>
    );
  }

  const saveButtonLabel = useMemo(() => {
    switch (saveStatus) {
      case Status.IDLE:
        return "Save";
      case Status.PENDING:
        return <CircleLoader />;
      case Status.SUCCESS:
        return "👌🏻";
      case Status.ERROR:
        return "⚠️";
    }
  }, [saveStatus]);

  const markup = (
    <Column>
      <Input
        label={"Title"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxWidth
      />
      <Input
        label={"Slug"}
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          if (!e.target.value) {
            hasEditedSlug.current = false;
          }
        }}
        onClick={() => (hasEditedSlug.current = true)}
        maxWidth
      />
      <Input
        label={"Body"}
        value={body}
        rows={5}
        variant="outlined"
        onChange={(e) => setBody(e.target.value)}
        maxWidth
        marginTop={20}
      />
      <Row>
        {renderAddImageButton()}
        {!!attachment && (
          <RowGroupEnd>
            <StyledText variant="subtitle2" text={attachment.name} />
            <IconButton
              edge="end"
              aria-label="delete-image"
              onClick={() => setAttachment(null)}
            >
              <DeleteIcon />
            </IconButton>
          </RowGroupEnd>
        )}
      </Row>
      <Row>
        <Checkbox
          value={isPrivate}
          onChange={() => setIsPrivate(!isPrivate)}
          disableRipple
        />
        <StyledButton
          label={saveButtonLabel}
          disabled={saveDisabled}
          onClick={handleSave}
        />
      </Row>
    </Column>
  );

  return (
    <HomePage
      title={PageTitle.NEW_POST}
      markup={markup}
      requireAuth
      mainClass="left"
    />
  );
};

export default NewPost;

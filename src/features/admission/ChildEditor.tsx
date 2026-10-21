import { RegisterSelect } from "../../components/RegisterSelect";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, LoaderCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useOperation } from "../../store/operation";
import { admissionService, childSchema } from "../../services/workflows";
import type { Baby, MotherAdmission } from "../../types";
import { ErrorState, errorMessage, Panel } from "../../components/common";
import { DateTimeField } from "../../components/DateTimeField";

const schema = z.object({
  children: z
    .array(
      childSchema.extend({
        id: z.string().optional(),
        gender: z.union([z.literal(""), childSchema.shape.gender]).pipe(childSchema.shape.gender),
      }),
    )
    .min(1),
});
type Values = z.infer<typeof schema>;
export function ChildEditor({
  mother,
  onCreated,
  onBusyChange,
  batchCount,
  existingChildren,
  onCancel,
}: {
  mother: MotherAdmission;
  onCreated: (babies: Baby[]) => void;
  onBusyChange: (busy: boolean) => void;
  batchCount?: number;
  existingChildren?: Baby[];
  onCancel?: () => void;
}) {
  const editing = !!existingChildren;
  const defaultName = (index: number, count: number) =>
    `baby${count > 1 ? index + 1 : ""} of ${mother.name.trim().split(/\s+/)[0]}`;
  const blank = (index: number, count: number) => ({
    firstName: defaultName(index, count),
    bloodType: "" as const,
    middleName: "",
    lastName: "",
    gender: "" as const,
    birthDate: (() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    })(),
    birthTime: "",
    weight: 0,
    height: 0,
    headCircumference: 0,
    maturityStatus: "Not assessed" as const,
    maturityNotes: "",
  });
  const [countEditing, setCountEditing] = useState(false);
  const [countDraft, setCountDraft] = useState(String(batchCount ?? 1));
  const savingRef = useRef(false);
  const [review, setReview] = useState<Values | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    register,
    getValues,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      children: existingChildren
        ? existingChildren.map((child) => ({
            ...child,
            bloodType: child.bloodType as Values["children"][number]["bloodType"],
            firstName: child.firstName ?? "",
            middleName: child.middleName ?? "",
            lastName: child.lastName ?? "",
          }))
        : Array.from({ length: batchCount ?? 1 }, (_, i) => blank(i, batchCount ?? 1)),
    },
  });
  const { fields, replace } = useFieldArray({
    control,
    name: "children",
  });
  function resizeChildren(count: number) {
    const current = getValues("children");
    replace(
      Array.from({ length: count }, (_, i) => {
        const child = current[i];
        if (!child) {
          const original = existingChildren?.[i];
          return original
            ? {
                ...original,
                bloodType: original.bloodType as Values["children"][number]["bloodType"],
                firstName: original.firstName ?? "",
                middleName: original.middleName ?? "",
                lastName: original.lastName ?? "",
              }
            : blank(i, count);
        }
        return {
          ...child,
          firstName:
            child.firstName === defaultName(i, current.length)
              ? defaultName(i, count)
              : child.firstName,
        };
      }),
    );
  }
  const multiple = fields.length > 1;
  async function create(values: Values) {
    if (savingRef.current || countEditing) return;
    savingRef.current = true;
    setBusy(true);
    onBusyChange(true);
    useOperation.getState().setSaving(true);
    setError("");
    try {
      onCreated(
        await (existingChildren
          ? admissionService.updateChildren(
              mother.id,
              values.children,
              existingChildren.map((child) => child.id),
            )
          : values.children.length > 1
            ? admissionService.createMultipleChildren(mother.id, values.children)
            : admissionService.createSingleChild(mother.id, values.children[0])),
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      savingRef.current = false;
      setBusy(false);
      onBusyChange(false);
      useOperation.getState().setSaving(false);
    }
  }
  return (
    <Panel
      title={editing ? "Edit children" : review ? "Review newborn records" : "Add Baby"}
      description={
        editing
          ? "Correct the registered children and birth count. Existing newborn identities and lab links are preserved."
          : review
            ? "Check each baby's details before creating the linked records."
            : batchCount
              ? "Complete the details of each newborn. Name and birth details are required."
              : "Start with one baby and add more as needed. Name and birth details are required."
      }
      action={
        batchCount ? (
          <div className="inline-baby-count">
            <label>
              Number of babies
              <input
                type="number"
                min="1"
                max="20"
                step="1"
                value={countDraft}
                readOnly={!countEditing}
                disabled={busy}
                onFocus={() => setCountEditing(true)}
                onChange={(e) => setCountDraft(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary"
              disabled={
                busy ||
                !countEditing ||
                !Number.isInteger(Number(countDraft)) ||
                Number(countDraft) < 1 ||
                Number(countDraft) > 20
              }
              onClick={() => {
                resizeChildren(Number(countDraft));
                setCountEditing(false);
              }}
            >
              Confirm count
            </button>
          </div>
        ) : !review ? (
          <button
            className="secondary add-baby"
            type="button"
            disabled={busy}
            onClick={() => resizeChildren(fields.length + 1)}
          >
            <Plus size={15} />
            Add Baby
          </button>
        ) : undefined
      }
    >
      {error && <ErrorState message={error} />}
      {existingChildren && fields.length < existingChildren.length && (
        <p className="count-correction-note">
          Saving will remove the last {existingChildren.length - fields.length} child record(s) from
          this admission. Children with linked lab requests cannot be removed.
        </p>
      )}
      <form
        onSubmit={handleSubmit((values) =>
          countEditing
            ? undefined
            : !batchCount && values.children.length > 1
              ? setReview(values)
              : create(values),
        )}
      >
        {review ? (
          <div className="child-review">
            {review.children.map((child, i) => (
              <div key={i}>
                <strong>
                  Baby {i + 1} ·{" "}
                  {[child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ") ||
                    "Name not entered"}
                </strong>
                <span>
                  {child.gender} · {child.birthDate} at {child.birthTime} · {child.weight} kg
                </span>
              </div>
            ))}
          </div>
        ) : (
          fields.map((field, i) => (
            <fieldset
              aria-labelledby={`${field.id}-title`}
              className="child-fields"
              disabled={busy || countEditing}
              key={field.id}
            >
              <legend className="baby-form-heading">
                <span id={`${field.id}-title`}>Baby {i + 1}</span>
                <label className="baby-inline-notes">
                  Clinical concerns / notes
                  <input
                    disabled={busy || countEditing}
                    {...register(`children.${i}.maturityNotes`)}
                    placeholder="Add a short note"
                    maxLength={1000}
                  />
                </label>
              </legend>
              <div className="newborn-details-grid">
                {([["firstName", "First Name"]] as const).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      required
                      autoComplete="off"
                      placeholder={label}
                      {...register(`children.${i}.${key}`)}
                    />
                    {errors.children?.[i]?.[key] && (
                      <small className="field-error">{errors.children[i]?.[key]?.message}</small>
                    )}
                  </label>
                ))}
                <Controller
                  control={control}
                  name={`children.${i}.gender`}
                  render={({ field: gender }) => (
                    <div>
                      <span className="field-label" id={`${field.id}-gender`}>
                        Baby gender
                      </span>
                      <div
                        className="newborn-gender-options"
                        role="radiogroup"
                        aria-labelledby={`${field.id}-gender`}
                      >
                        {(["Male", "Female"] as const).map((value) => (
                          <label key={value} className="newborn-gender-choice">
                            <input
                              type="radio"
                              name={gender.name}
                              value={value}
                              checked={gender.value === value}
                              onChange={() => gender.onChange(value)}
                              onBlur={gender.onBlur}
                              ref={gender.ref}
                              required
                            />
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              {value === "Male" ? (
                                <>
                                  <circle cx="9" cy="15" r="6" />
                                  <path d="m13 11 8-8M15 3h6v6" />
                                </>
                              ) : (
                                <>
                                  <circle cx="12" cy="8" r="6" />
                                  <path d="M12 14v8M8 18h8" />
                                </>
                              )}
                            </svg>
                            {value}
                          </label>
                        ))}
                      </div>
                      {errors.children?.[i]?.gender && (
                        <small className="field-error" role="alert">
                          {errors.children[i]?.gender?.message}
                        </small>
                      )}
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name={`children.${i}.birthDate`}
                  render={({ field: date }) => (
                    <DateTimeField
                      kind="date"
                      value={date.value}
                      onChange={date.onChange}
                      onBlur={date.onBlur}
                      error={errors.children?.[i]?.birthDate?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`children.${i}.birthTime`}
                  render={({ field: time }) => (
                    <DateTimeField
                      kind="time"
                      value={time.value}
                      onChange={time.onChange}
                      onBlur={time.onBlur}
                      error={errors.children?.[i]?.birthTime?.message}
                    />
                  )}
                />
                <label>
                  Weight (kg)
                  <input
                    type="number"
                    step="0.001"
                    {...register(`children.${i}.weight`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.children?.[i]?.weight && (
                    <small className="field-error">{errors.children[i]?.weight?.message}</small>
                  )}
                </label>
                {(
                  [
                    ["height", "Height (cm)"],
                    ["headCircumference", "Head circumference (cm)"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      {...register(`children.${i}.${key}`, {
                        setValueAs: (value) => (value === "" ? undefined : Number(value)),
                      })}
                    />
                    {errors.children?.[i]?.[key] && (
                      <small className="field-error">{errors.children[i]?.[key]?.message}</small>
                    )}
                  </label>
                ))}
                <Controller
                  control={control}
                  name={`children.${i}.maturityStatus`}
                  render={({ field: maturity }) => (
                    <RegisterSelect
                      label="Maturity status"
                      value={maturity.value ?? ""}
                      options={[
                        { value: "", label: "Select maturity status" },
                        ...["Term", "Preterm", "Post-term", "Not assessed"].map((value) => ({
                          value,
                          label: value,
                        })),
                      ]}
                      onChange={maturity.onChange}
                    />
                  )}
                />
              </div>
            </fieldset>
          ))
        )}
        <div className="panel-footer">
          <span>Records are linked to {mother.name}.</span>
          <div className="button-group">
            {editing && (
              <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
                Cancel editing
              </button>
            )}
            {review && (
              <button
                className="secondary"
                type="button"
                disabled={busy}
                onClick={() => setReview(null)}
              >
                Edit details
              </button>
            )}
            {review ? (
              <button
                className="primary"
                type="button"
                disabled={busy}
                onClick={() => create(review)}
              >
                {busy && <LoaderCircle size={15} className="spin" />}Create Child Records
              </button>
            ) : (
              <button className="primary" disabled={busy || countEditing}>
                {busy && <LoaderCircle size={15} className="spin" />}
                {editing
                  ? "Save changes"
                  : batchCount
                    ? "Add Baby"
                    : multiple
                      ? "Review child records"
                      : "Create Child Record"}
              </button>
            )}
          </div>
        </div>
      </form>
    </Panel>
  );
}

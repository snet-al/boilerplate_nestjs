export class BaseResource<Model> {
  data: Model[]
  meta: { total: number }
}

from httpx import AsyncClient

from conftest import auth_headers, register_user


async def _setup(client: AsyncClient) -> tuple[dict, dict]:
    user = await register_user(client)
    headers = auth_headers(user["access_token"])
    dep = (await client.post("/api/departments", json={"name": "Coding"}, headers=headers)).json()
    roadmap = (await client.post(f"/api/departments/{dep['id']}/roadmaps", json={"name": "R"}, headers=headers)).json()
    return headers, roadmap


async def test_create_and_list_items_as_tree(client: AsyncClient):
    headers, roadmap = await _setup(client)

    parent = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Learn Python"},
        headers=headers,
    )).json()
    assert parent["status"] == "not_started"

    child = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items",
        json={"name": "Learn FastAPI", "parent_id": parent["id"]},
        headers=headers,
    )).json()

    tree = (await client.get(f"/api/roadmaps/{roadmap['id']}/items", headers=headers)).json()
    assert len(tree) == 1
    assert tree[0]["name"] == "Learn Python"
    assert len(tree[0]["children"]) == 1
    assert tree[0]["children"][0]["name"] == "Learn FastAPI"


async def test_update_item_status(client: AsyncClient):
    headers, roadmap = await _setup(client)
    item = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Item"}, headers=headers
    )).json()

    res = await client.patch(f"/api/roadmap-items/{item['id']}", json={"status": "completed", "progress": 100}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
    assert res.json()["progress"] == 100


async def test_prerequisites(client: AsyncClient):
    headers, roadmap = await _setup(client)
    item_a = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "A"}, headers=headers)).json()
    item_b = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "B"}, headers=headers)).json()

    res = await client.post(
        f"/api/roadmap-items/{item_b['id']}/prerequisites",
        json={"prerequisite_item_id": item_a["id"]},
        headers=headers,
    )
    assert res.status_code == 201

    tree = (await client.get(f"/api/roadmaps/{roadmap['id']}/items", headers=headers)).json()
    item_b_data = next(i for i in tree if i["name"] == "B")
    assert item_a["id"] in item_b_data["prerequisite_ids"]

    # Remove prerequisite
    res = await client.delete(
        f"/api/roadmap-items/{item_b['id']}/prerequisites/{item_a['id']}", headers=headers
    )
    assert res.status_code == 204


async def test_delete_item(client: AsyncClient):
    headers, roadmap = await _setup(client)
    item = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "X"}, headers=headers)).json()

    assert (await client.delete(f"/api/roadmap-items/{item['id']}", headers=headers)).status_code == 204
    assert (await client.get(f"/api/roadmap-items/{item['id']}", headers=headers)).status_code == 404


async def test_reorder_items(client: AsyncClient):
    headers, roadmap = await _setup(client)
    item1 = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Step 1"}, headers=headers)).json()
    item2 = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Step 2"}, headers=headers)).json()
    item3 = (await client.post(f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Step 3"}, headers=headers)).json()

    # Reverse the order
    res = await client.patch(
        f"/api/roadmaps/{roadmap['id']}/items/reorder",
        json={"ordered_ids": [item3["id"], item1["id"], item2["id"]]},
        headers=headers,
    )
    assert res.status_code == 200
    reordered = res.json()
    assert len(reordered) == 3
    assert reordered[0]["id"] == item3["id"]
    assert reordered[0]["sort_order"] == 0
    assert reordered[1]["id"] == item1["id"]
    assert reordered[1]["sort_order"] == 1
    assert reordered[2]["id"] == item2["id"]
    assert reordered[2]["sort_order"] == 2


async def test_cascade_delete_children(client: AsyncClient):
    headers, roadmap = await _setup(client)
    parent = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Parent Step"}, headers=headers
    )).json()
    child = (await client.post(
        f"/api/roadmaps/{roadmap['id']}/items", json={"name": "Sub Skill", "parent_id": parent["id"]}, headers=headers
    )).json()

    # Delete parent
    res = await client.delete(f"/api/roadmap-items/{parent['id']}", headers=headers)
    assert res.status_code == 204

    # Child should be gone
    res_child = await client.get(f"/api/roadmap-items/{child['id']}", headers=headers)
    assert res_child.status_code == 404

